import { Component, OnInit, ViewChild } from '@angular/core';
import { TreeNode, MenuItem, MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { ChangeDetectionStrategy } from '@angular/core';
import { WorkflowDataService } from '../service/workflow-data.service';

interface WorkflowMetadata {
  _name: string;
  _initialStatus: string;
  _EmailAdmin: string;
  _SMSAdmin: string;
  _PreAppInitStatus: string;
}

interface Template {
  _name: string;
  _saveToRelatedDoc: boolean;
  _securePDF: boolean;
}

interface Letters {
  template: Template | Template[];
}

interface BusinessRule {
  _name: string;
  _ErrorMessage: string;
}

interface BusinessRules {
  rule: BusinessRule[];
}

interface Action {
  _type: 'email' | 'sms' | 'task' | 'decision' | 'document';
  _addressee: string;
  _subject?: string;
  _template?: string;
  _content?: string;
  _isReviewable?: string;
  _previewOnly?: string;
  _access?: string;
  _documentFolder?: string;
  _docType?: string;
  _mailMergeDataSource?: string;
  _decisionType?: string;
  _commencedBy?: string;
  _completedBy?: string;
  _isCombineAllotment?: string;
  _isSubdivision?: string;
  _displayLocation?: string;
  _costOfDevelopment?: string;
  _OPBuildingPart?: string;
  letters?: Letters;
}

interface Reminder {
  _content: string;
}

interface Transition {
  _input: string;
  _next: string;
  _selectAttachment: string;
  action?: Action[];
  reminder?: Reminder[];
  businessRules?: BusinessRules;
}

interface State {
  _name: string;
  _IdleDays: string;
  _assignedStaff?: string;
  transition?: Transition[];
}

interface WorkflowData extends WorkflowMetadata {
  state: State[];
}

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
  actionType?: 'email' | 'sms' | 'task' | 'decision' | 'document';
  addressee?: string[];
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
  templates?: Template[];
  
  // Business Rules
  businessRules?: BusinessRule[];
}

interface MultiNodeForm {
  type?: string;
  nodes: EditForm[];
}

interface NodeTypeConfig {
  allowedChildren: string[];
  requiredFields: string[];
  parentTypes: string[];
}

@Component({
  selector: 'app-workflow-visualizer',
  templateUrl: './workflow-visualizer.component.html',
  styleUrls: ['./workflow-visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WorkflowVisualizerComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  emailTemplates: any[] = [];
  addresseeOptions: any[] = [];

  isTableCollapsed: boolean = false;
  searchText: string = '';
  applicationTypes: any[] = [
    { label: 'All', value: null },
    { label: 'Type1', value: 'type1' },
    { label: 'Type2', value: 'type2' }
  ];
  applicationType: any = null;
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
    actionType: 'email',
    addressee: []
  };

  actionTypes: Array<{label: string, value: Action['_type']}> = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Task', value: 'task' },
    { label: 'Decision', value: 'decision' },
    { label: 'Document', value: 'document' }
  ];

  nodeTypeConfigs: { [key: string]: NodeTypeConfig } = {
    state: {
      allowedChildren: ['transition'],
      requiredFields: ['name', 'idleDays'],
      parentTypes: []  // States can only be at root level
    },
    transition: {
      allowedChildren: ['action'],
      requiredFields: ['input', 'next'],
      parentTypes: ['state']
    },
    action: {
      allowedChildren: ['template'],
      requiredFields: ['actionType', 'addressee'],
      parentTypes: ['transition']
    },
    template: {
      allowedChildren: [],
      requiredFields: ['name'],
      parentTypes: ['action']
    },
    reminder: {
      allowedChildren: [],
      requiredFields: ['content'],
      parentTypes: ['transition']
    }
  };

  nodeTypes: Array<{label: string, value: string}> = [
    { label: 'State', value: 'state' },
    { label: 'Transition', value: 'transition' },
    { label: 'Action', value: 'action' },
    { label: 'Template', value: 'template' },
    { label: 'Reminder', value: 'reminder' }
  ];

  
  

  booleanOptions: any[] = [
    { label: 'True', value: true },
    { label: 'False', value: false }
  ];

  showAddNodeDialog: boolean = false;
  multiNodeForm: MultiNodeForm = {
    type: '',
    nodes: []
  };

  // Add workflow metadata properties
  workflowName: string = '';
  initialStatus: string = '';
  emailAdmin: string = '';
  smsAdmin: string = '';
  preAppInitStatus: string = '';

  // Add missing properties
  preApplicationInitialStatus: string = '';
  selectedApplicationType: string = '';

  // Add new properties for IDs
  licenseId: number | null = null;
  applicationId: number | null = null;

  constructor( private workflowDataService: WorkflowDataService,private messageService: MessageService) {
    this.initializeSampleData();
  }

  ngOnInit() {
    this.loadEmailTemplatesAndAddressees();
  }
  loadEmailTemplatesAndAddressees() {
    // Get email templates only if both IDs are provided
    if (this.licenseId && this.applicationId) {
      this.workflowDataService.getEmailTemplates(this.licenseId, this.applicationId).subscribe({
        next: (templates) => {
          this.emailTemplates = templates;
          console.log('Email templates loaded:', templates);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load email templates'
          });
          console.error('Error loading templates:', error);
        }
      });
    }

    // Get addressees
    this.workflowDataService.getAddressees().subscribe({
      next: (addressees) => {
        this.addresseeOptions = addressees;
        console.log('Addressees loaded:', addressees);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load addressees'
        });
        console.error('Error loading addressees:', error);
      }
    });
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
  }

  getFilteredData(): TreeNode[] {
    if (!this.searchText && !this.applicationType) {
      return this.treeData;
    }

    return this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        JSON.stringify(node.data).toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = !this.applicationType || 
        node.data.type === this.applicationType;
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
      securePDF: node.data.securePDF === 'true'
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
        securePDF: this.editForm.securePDF?.toString()
      };
    }
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  cancelEdit() {
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  getMenuItems(node: TreeNode): MenuItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.startEdit(node)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteNode(node)
      }
    ];
  }

  deleteNode(node: TreeNode) {
    const removeFromParent = (parent: TreeNode[], target: TreeNode) => {
      const index = parent.indexOf(target);
      if (index > -1) {
        parent.splice(index, 1);
      }
    };

    if (node.parent) {
      removeFromParent(node.parent.children || [], node);
    } else {
      removeFromParent(this.treeData, node);
    }
  }

  resetFilters() {
    this.searchText = '';
    this.applicationType = null;
    this.clearData();
  }

  loadWorkflow(jsonData: WorkflowData) {
    try {
      console.log('Loading workflow data:', jsonData);
      
      if (jsonData.state) {
        // Store workflow metadata
        this.workflowName = jsonData._name;
        this.initialStatus = jsonData._initialStatus;
        this.emailAdmin = jsonData._EmailAdmin;
        this.smsAdmin = jsonData._SMSAdmin;
        this.preAppInitStatus = jsonData._PreAppInitStatus;

        const states = jsonData.state;
        this.treeData = states.map((state) => {
          return {
            data: {
              type: 'state',
              name: state._name,
              idleDays: state._IdleDays,
              assignedStaff: state._assignedStaff || ''
            },
            children: this.mapTransitions(state.transition || [])
          };
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Loaded ${states.length} states successfully`
        });
      } else {
        throw new Error('Invalid workflow format: missing state property');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to parse workflow data'
      });
    }
  }

  private mapTransitions(transitions: Transition | Transition[]): TreeNode[] {
    // If transitions is a single object, convert it to an array
    const transitionsArray = Array.isArray(transitions) ? transitions : [transitions];
    
    return transitionsArray.map((transition) => {
      const node: TreeNode = {
        data: {
          type: 'transition',
          name: transition._input,
          input: transition._input,
          next: transition._next,
          selectAttachment: transition._selectAttachment === 'true'
        },
        children: []
      };

      const nodeChildren: TreeNode[] = [];

      // Add actions if present
      if (transition.action?.length) {
        const actionNodes: TreeNode[] = [];
        
        transition.action.forEach((action) => {
          // Handle regular action
          const actionNode = this.createActionNode(action);
          actionNodes.push(actionNode);

          // Handle letter templates if present
          if (action.letters?.template) {
            const templates = Array.isArray(action.letters.template) ? 
              action.letters.template : [action.letters.template];
            
            templates.forEach((template) => {
              actionNodes.push(this.createTemplateNode(template));
            });
          }
        });

        nodeChildren.push(...actionNodes);
      }

      // Add reminders if present
      if (transition.reminder?.length) {
        const reminderNodes = transition.reminder.map((reminder) => 
          this.createReminderNode(reminder)
        );
        nodeChildren.push(...reminderNodes);
      }

      // Add business rules if present
      if (transition.businessRules?.rule?.length) {
        const ruleNodes = transition.businessRules.rule.map((rule) => 
          this.createBusinessRuleNode(rule)
        );
        nodeChildren.push(...ruleNodes);
      }

      node.children = nodeChildren;
      return node;
    });
  }

  private createActionNode(action: Action): TreeNode {
    return {
      data: {
        type: 'action',
        name: action._template || action._content || 'Unnamed Action',
        actionType: action._type,
        addressee: action._addressee ? action._addressee.split(',') : [],
        subject: action._subject || '',
        template: action._template || '',
        content: action._content || '',
        isReviewable: action._isReviewable === 'true',
        previewOnly: action._previewOnly === 'true',
        access: action._access || '',
        documentFolder: action._documentFolder || '',
        docType: action._docType || '',
        mailMergeDataSource: action._mailMergeDataSource || '',
        decisionType: action._decisionType || '',
        commencedBy: action._commencedBy || '',
        completedBy: action._completedBy || '',
        isCombineAllotment: action._isCombineAllotment === 'true',
        isSubdivision: action._isSubdivision === 'true',
        displayLocation: action._displayLocation || '',
        costOfDevelopment: action._costOfDevelopment || '',
        OPBuildingPart: action._OPBuildingPart || ''
      },
      children: []
    };
  }

  private createTemplateNode(template: Template): TreeNode {
    return {
      data: {
        type: 'template',
        name: template._name,
        saveToRelatedDoc: template._saveToRelatedDoc,
        securePDF: template._securePDF
      },
      children: []
    };
  }

  private createReminderNode(reminder: Reminder): TreeNode {
    return {
      data: {
        type: 'reminder',
        name: reminder._content,
        content: reminder._content
      },
      children: []
    };
  }

  private createBusinessRuleNode(rule: BusinessRule): TreeNode {
    return {
      data: {
        type: 'rule',
        name: rule._name,
        errorMessage: rule._ErrorMessage
      },
      children: []
    };
  }

  onFileUpload(event: any) {
    if (event.currentFiles && event.currentFiles.length > 0) {
      const file = event.currentFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          console.log('Parsed JSON:', json); // Debug log
          this.loadWorkflow(json);
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

      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to read file'
        });
      };

      reader.readAsText(file);
    }
  }

  onFileClear() {
    this.clearData();
  }

  downloadJson(): void {
    try {
      const downloadData: WorkflowData = {
        _name: this.workflowName || "BuildingPermit",
        _initialStatus: this.initialStatus || "New",
        _EmailAdmin: this.emailAdmin || "yes",
        _SMSAdmin: this.smsAdmin || "yes",
        _PreAppInitStatus: this.preAppInitStatus || "NewPreApplication",
        state: this.treeData.map(stateNode => {
          const state: State = {
            _name: stateNode.data.name,
            _IdleDays: stateNode.data.idleDays || "0"
          };

          if (stateNode.data.assignedStaff) {
            state._assignedStaff = stateNode.data.assignedStaff;
          }

          if (stateNode.children && stateNode.children.length > 0) {
            state.transition = stateNode.children.map(transNode => {
              const transition: Transition = {
                _input: transNode.data.input,
                _next: transNode.data.next,
                _selectAttachment: transNode.data.selectAttachment ? 'true' : 'false',
                action: [],    // Initialize arrays
                reminder: []   // Initialize arrays
              };

              if (transNode.children && transNode.children.length > 0) {
                transNode.children.forEach(child => {
                  if (child.data.type === 'action') {
                    const action: Action = {
                      _type: child.data.actionType as Action['_type'],
                      _addressee: Array.isArray(child.data.addressee) ? 
                        child.data.addressee.join(',') : child.data.addressee || '',
                      _template: child.data.template,
                      _subject: child.data.subject,
                      _isReviewable: child.data.isReviewable ? 'true' : 'false'
                    };

                    if (child.data.documentFolder) {
                      action._documentFolder = child.data.documentFolder;
                    }
                    if (child.data.docType) {
                      action._docType = child.data.docType;
                    }
                    if (child.data.content) {
                      action._content = child.data.content;
                    }
                    
                    transition.action?.push(action);
                  } else if (child.data.type === 'reminder') {
                    transition.reminder?.push({
                      _content: child.data.content
                    });
                  }
                });
              }
              return transition;
            });
          }
          return state;
        })
      };

      const jsonData = JSON.stringify(downloadData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workflow.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Workflow downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download workflow'
      });
    }
  }

  openJsonEditor() {
    try {
      // Create the complete workflow data structure
      const workflowData: WorkflowData = {
        _name: this.workflowName || "BuildingPermit",
        _initialStatus: this.initialStatus || "New",
        _EmailAdmin: this.emailAdmin || "yes",
        _SMSAdmin: this.smsAdmin || "yes",
        _PreAppInitStatus: this.preAppInitStatus || "NewPreApplication",
        state: this.treeData.map(stateNode => {
          const state: State = {
            _name: stateNode.data.name,
            _IdleDays: stateNode.data.idleDays || "0"
          };

          if (stateNode.data.assignedStaff) {
            state._assignedStaff = stateNode.data.assignedStaff;
          }

          if (stateNode.children && stateNode.children.length > 0) {
            state.transition = stateNode.children.map(transNode => {
              const transition: Transition = {
                _input: transNode.data.input || transNode.data.name,
                _next: transNode.data.next || "",
                _selectAttachment: transNode.data.selectAttachment ? 'true' : 'false',
                action: [],
                reminder: []
              };

              if (transNode.children && transNode.children.length > 0) {
                transNode.children.forEach(child => {
                  if (child.data.type === 'action') {
                    const action: Action = {
                      _type: child.data.actionType as Action['_type'],
                      _addressee: Array.isArray(child.data.addressee) ? 
                        child.data.addressee.join(',') : child.data.addressee || '',
                      _template: child.data.template || '',
                      _subject: child.data.subject || '',
                      _isReviewable: child.data.isReviewable ? 'true' : 'false'
                    };
                    transition.action?.push(action);
                  } else if (child.data.type === 'reminder') {
                    transition.reminder?.push({
                      _content: child.data.content || ''
                    });
                  }
                });
              }
              return transition;
            });
          }
          return state;
        })
      };

      this.jsonEditorContent = JSON.stringify(workflowData, null, 2);
      this.showJsonEditor = true;
    } catch (error) {
      console.error('Error preparing JSON data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to prepare JSON data for editing'
      });
    }
  }

  closeJsonEditor() {
    this.showJsonEditor = false;
    this.jsonEditorContent = '';
  }

  applyJsonChanges() {
    try {
      const newData = JSON.parse(this.jsonEditorContent);
      this.loadWorkflow(newData);
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

  clearData() {
    this.treeData = [];
    this.fileUploaded = false;
    // Reset the file upload component
    const fileUpload = document.querySelector('p-fileUpload') as any;
    if (fileUpload?.clear) {
      fileUpload.clear();
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Reset',
      detail: 'All data has been cleared'
    });
  }

  getEmptyNodeForm(): EditForm {
    return {
      name: '',
      actionType: 'email',
      addressee: []
    };
  }

  getAvailableNodeTypes(): Array<{label: string, value: string}> {
    if (!this.selectedNode) {
      // At root level, only allow State
      return [{ label: 'State', value: 'state' }];
    }

    const parentType = this.selectedNode.data._type || this.selectedNode.data.type;
    const config = this.nodeTypeConfigs[parentType];
    
    if (!config) {
      return [];
    }

    return config.allowedChildren.map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type
    }));
  }

  openAddNodeDialog(node?: TreeNode) {
    this.selectedNode = node || null;
    this.multiNodeForm = {
      type: '',
      nodes: [this.getEmptyNodeForm()]
    };
    this.showAddNodeDialog = true;
  }

  addNewNodeForm() {
    const emptyForm = this.getEmptyNodeForm();
    // Make sure these properties are properly initialized
    emptyForm.template = '';
    emptyForm.addressee = [];
    this.multiNodeForm.nodes.push(emptyForm);
  }

  removeNodeForm(index: number) {
    if (this.multiNodeForm.nodes.length > 1) {
      this.multiNodeForm.nodes.splice(index, 1);
    }
  }

  addNodes() {
    // Validate all nodes
    for (const nodeForm of this.multiNodeForm.nodes) {
      nodeForm.type = this.multiNodeForm.type;
      const validation = this.validateNewNode(nodeForm);
      if (!validation.valid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: validation.message
        });
        return;
      }
    }

    // Add all nodes
    for (const nodeForm of this.multiNodeForm.nodes) {
      const newNode: TreeNode = {
        data: {
          type: nodeForm.type,
          name: nodeForm.name || nodeForm.input || 'New Node',
          ...this.getNodeSpecificData(nodeForm)
        },
        children: []
      };

      if (this.selectedNode) {
        if (!this.selectedNode.children) {
          this.selectedNode.children = [];
        }
        this.selectedNode.children.push(newNode);
      } else {
        this.treeData.push(newNode);
      }
    }

    this.showAddNodeDialog = false;
    this.multiNodeForm = {
      type: '',
      nodes: []
    };
    this.selectedNode = null;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Added ${this.multiNodeForm.nodes.length} nodes successfully`
    });
  }

  validateNewNode(nodeForm: EditForm): { valid: boolean; message?: string } {
    if (!nodeForm.type) {
      return { valid: false, message: 'Please select a node type' };
    }

    const config = this.nodeTypeConfigs[nodeForm.type];
    
    // Check if parent type is valid
    if (this.selectedNode) {
      const parentType = this.selectedNode.data.type;
      if (!config.parentTypes.includes(parentType)) {
        return { 
          valid: false, 
          message: `${nodeForm.type} cannot be added to ${parentType}` 
        };
      }
    } else if (nodeForm.type !== 'state') {
      return { 
        valid: false, 
        message: 'Only states can be added at the root level' 
      };
    }

    // Check required fields
    for (const field of config.requiredFields) {
      const value = nodeForm[field as keyof EditForm];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return { 
          valid: false, 
          message: `${field} is required for ${nodeForm.type}` 
        };
      }
    }

    return { valid: true };
  }

  private getNodeSpecificData(nodeForm: EditForm): any {
    const data: any = {};
    
    switch (nodeForm.type) {
      case 'state':
        data.idleDays = nodeForm.idleDays;
        break;
      case 'transition':
        data.input = nodeForm.input;
        data.next = nodeForm.next;
        data.selectAttachment = nodeForm.selectAttachment;
        break;
      case 'action':
        data.actionType = nodeForm.actionType;
        data.addressee = nodeForm.addressee;
        data.subject = nodeForm.subject;
        data.template = nodeForm.template;
        data.content = nodeForm.content;
        break;
      case 'reminder':
        data.content = nodeForm.content;
        break;
      case 'template':
        data.name = nodeForm.name;
        data.saveToRelatedDoc = nodeForm.saveToRelatedDoc;
        data.securePDF = nodeForm.securePDF;
        break;
    }
    
    return data;
  }

  cancelAddNode() {
    this.showAddNodeDialog = false;
    this.multiNodeForm = {
      type: '',
      nodes: []
    };
    this.selectedNode = null;
  }

  // Add missing method
  filterNodes() {
    // If there's no search text or selected type, return all nodes
    if (!this.searchText && !this.selectedApplicationType) {
      return this.treeData;
    }

    // Filter nodes based on search text and selected type
    const filteredData = this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        node.data.name.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesType = !this.selectedApplicationType || 
        node.data.type === this.selectedApplicationType;

      return matchesSearch && matchesType;
    });

    return filteredData;
  }

  toggleTableCollapse() {
    this.isTableCollapsed = !this.isTableCollapsed;
  }

  // Add new method for handling ID submission
  onSubmitIds() {
    if (!this.licenseId || !this.applicationId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter both License ID and Application ID'
      });
      return;
    }

    // Call the service with the IDs
    this.workflowDataService.getEmailTemplates(this.licenseId, this.applicationId).subscribe({
      next: (templates) => {
        this.emailTemplates = templates;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Sent successfully'
        });
        console.log('Email templates loaded:', templates);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load email templates'
        });
        console.error('Error loading templates:', error);
      }
    });
  }
}
