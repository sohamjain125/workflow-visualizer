import { Component, OnInit, ViewChild } from '@angular/core';
import { TreeNode, MenuItem, MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Menu } from 'primeng/menu';

interface EditForm {
  // Common properties
  name: string;
  type?: string;
  idleDays?: string;
  assignedStaff?: string;
  initialStatus?: string;
  emailAdmin?: string;
  smsAdmin?: string;
  preAppInitStatus?: string;

  // Action properties
  actionType?: string;
  addressee?: string[];  // Changed to array for multi-select
  subject?: string;
  template?: string;
  content?: string;
  isReviewable?: boolean;
  previewOnly?: boolean;
  access?: string;
  documentFolder?: string;
  docType?: string;
  mailMergeDataSource?: string;

  // Decision properties
  decisionType?: string;
  commencedBy?: string;
  completedBy?: string;
  isCombineAllotment?: boolean;
  isSubdivision?: boolean;
  displayLocation?: string;
  costOfDevelopment?: string;
  OPBuildingPart?: string;

  // Transition properties
  input?: string;
  next?: string;
  selectAttachment?: boolean;

  // Template properties
  saveToRelatedDoc?: boolean;
  securePDF?: boolean;
  templates?: any[];

  // New properties
  details?: string;
  conditions?: string[];
}

@Component({
  selector: 'app-workflow-visualizer',
  templateUrl: './workflow-visualizer.component.html',
  styleUrls: ['./workflow-visualizer.component.scss']
})
export class WorkflowVisualizerComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  @ViewChild('menu') menu!: Menu;
  
  searchText: string = '';
  selectedApplicationType: string | null = null;
  applicationTypes: any[] = [];
  loading: boolean = false;
  fileUploaded: boolean = false;
  editingKey: string | null = null;
  draftValue: string = '';
  showJsonEditor: boolean = false;
  jsonEditorContent: string = '';
  treeData: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  editDialogVisible: boolean = false;
  editForm: EditForm = {
    name: '',
    type: '',
    actionType: '',
    details: '',
    conditions: []
  };

  actionTypes: any[] = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Task', value: 'task' },
    { label: 'Decision', value: 'decision' },
    { label: 'Document', value: 'document' }
  ];

  nodeTypes: any[] = [
    { label: 'State', value: 'state' },
    { label: 'Transition', value: 'transition' },
    { label: 'Action', value: 'action' },
    { label: 'Template', value: 'template' },
    { label: 'Reminder', value: 'reminder' }
  ];

  addresseeOptions: any[] = [
    { label: 'Applicant', value: 'Applicant' },
    { label: 'Owner', value: 'Owner' },
    { label: 'Builder', value: 'Builder' },
    { label: 'Council', value: 'Council' },
    { label: 'AssignedStaff', value: 'AssignedStaff' },
    { label: 'SignOffStaff', value: 'SignOffStaff' }
  ];

  booleanOptions: any[] = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  showAddNodeDialog: boolean = false;
  newNodeForm: EditForm = {
    name: '',
    type: ''
  };

  // Add workflow metadata properties
  workflowName: string = '';
  initialStatus: string = '';
  emailAdmin: string = '';
  smsAdmin: string = '';
  preAppInitStatus: string = '';

  // Add missing properties
  preApplicationInitialStatus: string = '';

  // Add missing property
  treeNodes: TreeNode[] = [];

  constructor(private messageService: MessageService) {
    this.initializeSampleData();
  }

  ngOnInit() {
    this.loadApplicationTypes();
    this.loadAddresseeOptions();
    this.treeNodes = this.treeData; // Initialize treeNodes from treeData
  }

  initializeSampleData() {
    this.treeData = [
      {
        data: { type: 'state', name: 'New' },
        children: [
          {
            data: { type: 'transition', name: 'Submit' },
            children: [
              {
                data: { 
                  type: 'action',
                  name: 'Send Email',
                  actionType: 'email',
                  addressee: ['applicant']
                }
              }
            ]
          }
        ]
      },
      {
        data: { type: 'state', name: 'Submitted' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Requested' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Received' },
        children: []
      }
    ];
    this.treeNodes = this.treeData; // Initialize treeNodes
  }

  getFilteredData(): TreeNode[] {
    if (!this.searchText && !this.selectedApplicationType) {
      return this.treeData;
    }

    return this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        JSON.stringify(node.data).toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = !this.selectedApplicationType || 
        node.data.type === this.selectedApplicationType;
      return matchesSearch && matchesType;
    });
  }

  startEdit(node: TreeNode) {
    this.selectedNode = node;
    this.editForm = {
      name: node.data.name,
      type: node.data.type,
      idleDays: node.data.idleDays,
      assignedStaff: node.data.assignedStaff,
      
      // Action properties
      actionType: node.data.actionType,
      addressee: Array.isArray(node.data.addressee) ? node.data.addressee : 
                (node.data.addressee ? node.data.addressee.split(',').map((a: string) => a.trim()) : []),
      subject: node.data.subject,
      template: node.data.template,
      content: node.data.content,
      isReviewable: node.data.isReviewable === 'true',
      previewOnly: node.data.previewOnly === 'true',
      access: node.data.access,
      documentFolder: node.data.documentFolder,
      docType: node.data.docType,
      mailMergeDataSource: node.data.mailMergeDataSource,

      // Decision properties
      decisionType: node.data.decisionType,
      commencedBy: node.data.commencedBy,
      completedBy: node.data.completedBy,
      isCombineAllotment: node.data.isCombineAllotment === 'true',
      isSubdivision: node.data.isSubdivision === 'true',
      displayLocation: node.data.displayLocation,
      costOfDevelopment: node.data.costOfDevelopment,
      OPBuildingPart: node.data.OPBuildingPart,

      // Transition properties
      input: node.data.input,
      next: node.data.next,
      selectAttachment: node.data.selectAttachment === 'true',

      // Template properties
      saveToRelatedDoc: node.data.saveToRelatedDoc === 'true',
      securePDF: node.data.securePDF === 'true',

      // New properties
      details: node.data.details,
      conditions: node.data.conditions
    };
    this.editDialogVisible = true;
  }

  saveEdit() {
    if (this.selectedNode) {
      this.selectedNode.data = {
        ...this.selectedNode.data,
        name: this.editForm.name,
        type: this.editForm.type,
        idleDays: this.editForm.idleDays,
        assignedStaff: this.editForm.assignedStaff,
        
        // Action properties
        actionType: this.editForm.actionType,
        addressee: Array.isArray(this.editForm.addressee) ? this.editForm.addressee.join(',') : '',
        subject: this.editForm.subject,
        template: this.editForm.template,
        content: this.editForm.content,
        isReviewable: this.editForm.isReviewable?.toString(),
        previewOnly: this.editForm.previewOnly?.toString(),
        access: this.editForm.access,
        documentFolder: this.editForm.documentFolder,
        docType: this.editForm.docType,
        mailMergeDataSource: this.editForm.mailMergeDataSource,

        // Decision properties
        decisionType: this.editForm.decisionType,
        commencedBy: this.editForm.commencedBy,
        completedBy: this.editForm.completedBy,
        isCombineAllotment: this.editForm.isCombineAllotment?.toString(),
        isSubdivision: this.editForm.isSubdivision?.toString(),
        displayLocation: this.editForm.displayLocation,
        costOfDevelopment: this.editForm.costOfDevelopment,
        OPBuildingPart: this.editForm.OPBuildingPart,

        // Transition properties
        input: this.editForm.input,
        next: this.editForm.next,
        selectAttachment: this.editForm.selectAttachment?.toString(),

        // Template properties
        saveToRelatedDoc: this.editForm.saveToRelatedDoc?.toString(),
        securePDF: this.editForm.securePDF?.toString(),

        // New properties
        details: this.editForm.details,
        conditions: this.editForm.conditions
      };
      this.editDialogVisible = false;
      this.selectedNode = null;
      this.editForm = {
        name: '',
        type: '',
        actionType: '',
        details: '',
        conditions: []
      };
    }
  }

  cancelEdit() {
    this.editDialogVisible = false;
    this.selectedNode = null;
    this.editForm = {
      name: '',
      type: '',
      actionType: '',
      details: '',
      conditions: []
    };
  }

  // Node adding
  addNode() {
    const newNode = {
      label: this.newNodeForm.name,
      data: {
        type: this.newNodeForm.type,
        name: this.newNodeForm.name
      },
      children: []
    };
    this.treeData.push(newNode);
    this.showAddNodeDialog = false;
    this.newNodeForm = { name: '', type: '' };
  }

  cancelAddNode() {
    this.showAddNodeDialog = false;
    this.newNodeForm = { name: '', type: '' };
  }

  // Filter handling
  resetFilters() {
    this.searchText = '';
    this.selectedApplicationType = null;
  }

  // Helper methods
  private loadApplicationTypes() {
    // Load application types from your data source
    this.applicationTypes = [
      { label: 'Type 1', value: 'type1' },
      { label: 'Type 2', value: 'type2' }
    ];
  }

  private loadAddresseeOptions() {
    // Load addressee options from your data source
    this.addresseeOptions = [
      { label: 'User 1', value: 'user1' },
      { label: 'User 2', value: 'user2' }
    ];
  }

  private transformToTreeNodes(json: any): TreeNode[] {
    console.log('Transforming JSON to tree nodes:', json); // Debug log
    
    if (!Array.isArray(json)) {
      json = [json];
    }

    const nodes = json.map((node: any) => {
      const treeNode: TreeNode = {
        label: node.name || node.label || '',
        data: {
          ...node,
          type: node._type || node.type || 'unknown',
          name: node.name || node.label || ''
        },
        children: node.children ? this.transformToTreeNodes(node.children) : undefined
      };
      return treeNode;
    });
    
    console.log('Transformed nodes:', nodes); // Debug log
    return nodes;
  }

  // Download functionality
  downloadJson() {
    const json = JSON.stringify(this.treeData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Add missing methods
  onUpload(event: any) {
    console.log('Upload event received:', event); // Debug log
    
    if (event.files && event.files.length > 0) {
      const file = event.files[0];
      console.log('File to process:', file); // Debug log
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          console.log('Parsed JSON:', json); // Debug log
          
          // Transform the JSON into tree nodes
          const transformedData = this.transformToTreeNodes(json);
          console.log('Transformed data:', transformedData); // Debug log
          
          // Update both treeData and treeNodes
          this.treeData = transformedData;
          this.treeNodes = transformedData;
          
          // Force change detection
          this.treeNodes = [...this.treeNodes];
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File uploaded successfully'
          });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid JSON file'
          });
        }
      };
      reader.readAsText(file);
    }
  }

  showJsonDialog() {
    this.jsonEditorContent = JSON.stringify(this.treeNodes, null, 2);
    this.showJsonEditor = true;
  }

  closeJsonEditor() {
    this.showJsonEditor = false;
  }

  applyJsonChanges() {
    try {
      const newData = JSON.parse(this.jsonEditorContent);
      this.treeData = this.transformToTreeNodes(newData);
      this.treeNodes = this.treeData;
      this.showJsonEditor = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'JSON changes applied successfully'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid JSON format'
      });
    }
  }

  getNodeIcon(node: TreeNode): string {
    const type = node.data?._type || node.data?.type;
    switch (type?.toLowerCase()) {
      case 'action':
        return 'pi pi-cog';
      case 'condition':
        return 'pi pi-question-circle';
      case 'state':
        return 'pi pi-circle';
      default:
        return 'pi pi-circle';
    }
  }

  getNodeType(node: TreeNode): string {
    return node.data?._type || node.data?.type || 'Unknown';
  }

  editNode(node: TreeNode) {
    this.selectedNode = node;
    this.editForm = {
      name: node.data.name,
      type: node.data.type,
      idleDays: node.data.idleDays,
      assignedStaff: node.data.assignedStaff,
      
      // Action properties
      actionType: node.data.actionType,
      addressee: Array.isArray(node.data.addressee) ? node.data.addressee : 
                (node.data.addressee ? node.data.addressee.split(',').map((a: string) => a.trim()) : []),
      subject: node.data.subject,
      template: node.data.template,
      content: node.data.content,
      isReviewable: node.data.isReviewable === 'true',
      previewOnly: node.data.previewOnly === 'true',
      access: node.data.access,
      documentFolder: node.data.documentFolder,
      docType: node.data.docType,
      mailMergeDataSource: node.data.mailMergeDataSource,

      // Decision properties
      decisionType: node.data.decisionType,
      commencedBy: node.data.commencedBy,
      completedBy: node.data.completedBy,
      isCombineAllotment: node.data.isCombineAllotment === 'true',
      isSubdivision: node.data.isSubdivision === 'true',
      displayLocation: node.data.displayLocation,
      costOfDevelopment: node.data.costOfDevelopment,
      OPBuildingPart: node.data.OPBuildingPart,

      // Transition properties
      input: node.data.input,
      next: node.data.next,
      selectAttachment: node.data.selectAttachment === 'true',

      // Template properties
      saveToRelatedDoc: node.data.saveToRelatedDoc === 'true',
      securePDF: node.data.securePDF === 'true',

      // New properties
      details: node.data.details,
      conditions: node.data.conditions
    };
    this.editDialogVisible = true;
  }

  openAddNodeDialog() {
    this.showAddNodeDialog = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          console.log('Parsed JSON:', json);
          
          // Transform the JSON into tree nodes
          const transformedData = this.transformToTreeNodes(json);
          console.log('Transformed data:', transformedData);
          
          // Update both treeData and treeNodes
          this.treeData = transformedData;
          this.treeNodes = [...transformedData];
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File uploaded successfully'
          });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid JSON file'
          });
        }
      };
      reader.readAsText(file);
    }
  }
}
